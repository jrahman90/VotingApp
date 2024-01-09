# Voting app

## Requirements

node v20.9.0
npm 10.1.0

## Install dependencies

```bash
    cd server && npm install && cd ../client && npm install && cd ..
```

## Initialize db locally

Install postresql

```bash
    brew install postresql
```

Run postresql service

```bash
    brew services start postresql@14
```

Access postgres cli

```bash
    psql postgres
```

Execute init sql script

```bash
    \i /Users/sebastianflor/workspace/VotingApp/initDB.sql
```

## Run server

```bash
    npm run server
```

## Run client

```bash
    npm run client
```
