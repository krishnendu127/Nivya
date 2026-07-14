CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE kyc_status AS ENUM ('pending', 'in_progress', 'registered', 'rejected');

CREATE TABLE users (
    id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    phone       VARCHAR(15)  NOT NULL UNIQUE,
    email       VARCHAR(255),
    kyc_status  kyc_status   NOT NULL DEFAULT 'pending',
    pan         VARCHAR(512),
    name        VARCHAR(255),
    dob         DATE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_phone ON users(phone);
