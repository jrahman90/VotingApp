# Voting app

## Test instructions

Test staff users

- <admin@mail.com> / test1234
- <test@mail.com> / test1234

Test voter users

- voter id 100
- voter id 101
- voter id 102

1. Open a browser tab and login with staff credentials
2. open another browser tab and register device
3. optionally open one or two more tabs to register devices
4. in the first tab with staff credentials assign voter id (100, 101, 103) to a given device in the list
5. go to the voter tab and now you can continue with the voting and vote

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

Connect to db with psql command

```bash
    psql -U voting_user -d votingappdb
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

## Reset db

```bash
    cd server && npx prisma migrate reset
```
