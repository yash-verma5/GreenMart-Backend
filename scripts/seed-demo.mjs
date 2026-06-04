#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const DEFAULT_BACKEND_URL = "https://greenmart-backend-1-5bnj.onrender.com";
const backendUrl = normalizeUrl(process.env.BACKEND_URL || DEFAULT_BACKEND_URL);
const seedFile = process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), "demo-seed.json");

const seed = JSON.parse(await readFile(seedFile, "utf8"));
const state = {
  usersByEmail: new Map(),
  tokensByEmail: new Map(),
  categoriesByName: new Map(),
  productsByName: new Map()
};

console.log(`Seeding GreenMart demo data into ${backendUrl}`);
console.log(`Using seed file: ${seedFile}`);

await seedUsers(seed.users || []);
await loginUsers(seed.users || []);
await seedCategories(seed.categories || []);
await seedProducts(seed.products || []);
await seedReviews(seed.reviews || []);

console.log("Demo seed complete.");

async function seedUsers(users) {
  const existingUsers = await request("/api/v1/users");
  for (const user of existingUsers) {
    if (user.email) state.usersByEmail.set(user.email, user);
  }

  for (const user of users) {
    if (state.usersByEmail.has(user.email)) {
      console.log(`User exists: ${user.email}`);
      continue;
    }

    const created = await request("/api/v1/users/register", {
      method: "POST",
      body: user
    });
    state.usersByEmail.set(created.email, created);
    console.log(`Created user: ${created.email} (${created.role})`);
  }
}

async function loginUsers(users) {
  for (const user of users) {
    const auth = await request("/api/v1/auth/login", {
      method: "POST",
      body: {
        email: user.email,
        password: user.password
      }
    });
    state.tokensByEmail.set(user.email, auth.token);
    console.log(`Logged in: ${user.email}`);
  }
}

async function seedCategories(categories) {
  const existingCategories = await request("/api/v1/categories");
  for (const category of existingCategories) {
    if (category.name) state.categoriesByName.set(category.name, category);
  }

  for (const category of categories) {
    if (state.categoriesByName.has(category.name)) {
      console.log(`Category exists: ${category.name}`);
      continue;
    }

    const created = await request("/api/v1/categories", {
      method: "POST",
      body: category
    });
    state.categoriesByName.set(created.name, created);
    console.log(`Created category: ${created.name}`);
  }
}

async function seedProducts(products) {
  const existingProducts = await request("/api/v1/products");
  for (const product of existingProducts) {
    if (product.name) state.productsByName.set(product.name, product);
  }

  for (const product of products) {
    const category = state.categoriesByName.get(product.categoryName);
    if (!category) throw new Error(`Missing category for product "${product.name}": ${product.categoryName}`);

    let savedProduct = state.productsByName.get(product.name);
    if (savedProduct) {
      console.log(`Product exists: ${product.name}`);
    } else {
      const token = state.tokensByEmail.get(product.vendorEmail);
      if (!token) throw new Error(`Missing vendor token for ${product.vendorEmail}`);

      savedProduct = await request("/api/v1/products", {
        method: "POST",
        token,
        body: {
          name: product.name,
          categoryId: category.id,
          description: product.description,
          price: product.price,
          quantity: product.quantity,
          imagePath: product.imagePath
        }
      });
      state.productsByName.set(savedProduct.name, savedProduct);
      console.log(`Created product: ${savedProduct.name}`);
    }

    if (product.status && savedProduct.status !== product.status) {
      savedProduct = await request(`/api/v1/products/${savedProduct.id}/status?status=${encodeURIComponent(product.status)}`, {
        method: "PUT"
      });
      state.productsByName.set(savedProduct.name, savedProduct);
      console.log(`Set product status: ${savedProduct.name} -> ${savedProduct.status}`);
    }
  }
}

async function seedReviews(reviews) {
  for (const review of reviews) {
    const product = state.productsByName.get(review.productName);
    if (!product) throw new Error(`Missing product for review: ${review.productName}`);

    const existingReviews = await request(`/api/v1/reviews/product/${product.id}`);
    const alreadyExists = existingReviews.some((existing) =>
      existing.comment === review.comment && Number(existing.rating) === Number(review.rating)
    );
    if (alreadyExists) {
      console.log(`Review exists: ${review.productName} (${review.rating})`);
      continue;
    }

    const token = state.tokensByEmail.get(review.customerEmail);
    if (!token) throw new Error(`Missing customer token for ${review.customerEmail}`);

    await request("/api/v1/reviews", {
      method: "POST",
      token,
      body: {
        productId: product.id,
        rating: review.rating,
        comment: review.comment
      }
    });
    console.log(`Created review: ${review.productName} (${review.rating})`);
  }
}

async function request(route, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
  };

  const response = await fetch(`${backendUrl}${route}`, {
    method: options.method || "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const message = data?.message || response.statusText;
    throw new Error(`${options.method || "GET"} ${route} failed (${response.status}): ${message}`);
  }

  return data;
}

function normalizeUrl(url) {
  return url.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
}
