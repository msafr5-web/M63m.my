-- Run once as a PostgreSQL superuser (e.g. via psql -U postgres -f scripts/create-db.sql).
-- Change the password, then put the same value in DATABASE_URL inside .env.

CREATE ROLE m63m WITH LOGIN PASSWORD 'm63m_password';
CREATE DATABASE m63m OWNER m63m ENCODING 'UTF8' TEMPLATE template0;
