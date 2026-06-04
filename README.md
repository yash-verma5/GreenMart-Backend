# GreenMart

## Description
This is the backend of our final cdac project 'GreenMart'

## Links
For the frontend please go here<br>
https://github.com/D6-GreenMart/GreenMart-Frontend<br><br>
For the project documentation please go here<br>
https://drive.google.com/file/d/1H6oIPP48zm1A4mCptkiUe8_rTSrzwNHO/view?usp=sharing<br>

## Local Development
Run with the default local MySQL fallback:

```bash
mvn spring-boot:run
```

If you have `src/main/resources/application-local.properties`, run with the local profile:

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=local
```

`application-local.properties` is ignored by Git because it can contain private database credentials.

## Deployment Environment Variables
Deploy this repo from the `deploy/showcase` branch.

Add these variables in Render or Railway for the backend service:

```txt
DB_URL=jdbc:mysql://your-db-host:4000/your-db-name?sslMode=REQUIRED
DB_USERNAME=your-db-username
DB_PASSWORD=your-db-password
JWT_SECRET=replace-with-a-long-random-secret
CORS_ALLOWED_ORIGINS=https://your-vercel-frontend-url.vercel.app
```

For local frontend testing against the deployed backend, you can temporarily allow both origins:

```txt
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-vercel-frontend-url.vercel.app
```

The app reads these values from `src/main/resources/application.properties`. If an env variable is missing, Spring uses the local fallback value from that file.

## Render/Railway Settings
Use Java 17.

Typical commands:

```txt
Build Command: mvn clean package -DskipTests
Start Command: java -jar target/app-0.0.1-SNAPSHOT.jar
```

Deploy the backend first. After it has a public URL, set the frontend `VITE_API_URL` to `https://your-backend-domain/api/v1` and redeploy the frontend.
