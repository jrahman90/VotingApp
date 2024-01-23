# Voting app

## Requirements

node v20.9.0
npm 10.1.0

## Initialize db locally

Install postresql

```bash
    brew install postresql@14
```

Run postresql service

```bash
    brew services start postresql@14
```

Access postgres cli

```bash
    psql postgres
```

Execute init sql script -> $user is your current user

```bash
    \i /Users/${user}/workspace/VotingApp/initDB.sql
```

## Install dependencies

Server dependencies

```bash
    cd server && npm install && npx prisma migrate dev
```

Client dependencies

```bash
    cd client && npm install
```

## Run server

```bash
    npm run server
```

## Run client

```bash
    npm run client
```
