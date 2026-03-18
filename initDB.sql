CREATE USER voting_user WITH PASSWORD 'test123';

CREATE DATABASE votingappdb;

GRANT ALL PRIVILEGES ON DATABASE votingappdb TO voting_user;

ALTER USER voting_user CREATEDB;