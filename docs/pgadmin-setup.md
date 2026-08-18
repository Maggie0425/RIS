# pgAdmin Setup

1. Start the containers:

   ```bash
   docker compose up -d
   ```

2. Wait until pgAdmin is ready:

   ```bash
   docker compose logs -f pgadmin
   ```

3. Open `http://localhost:5050` and sign in:

   ```text
   Email: admin@risproject.com
   Password: ris_pgadmin_password
   ```

4. Register the PostgreSQL server:

   ```text
   Name: RIS PostgreSQL
   Host: postgres
   Port: 5432
   Maintenance database: ris
   Username: ris
   Password: ris_dev_password
   ```

Use `postgres`, not `localhost`, as the host because containers communicate using Compose service names. Credentials and host ports can be changed in the local `.env` file.
