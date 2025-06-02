# Local Development

If you want to contribute to Rever, or make and test changes you will need the development version of the software.

For best performance during development, we recommend that you run postgres, redis, api inside docker containers and run the frontend on the host machine.

## Dependencies

Install the following dependencies if you dont have them.

1. GIT
2. Docker Desktop
3. Node.js (v18)
4. Yarn

## Download

Download the code with the following command

```sh
git clone git@github.com:makerever/rever
```

## Configuration

### ENV

In the `api` directory Copy .env.sample to .env - for development most of the sample values should work as is but it is required to configure the SMTP credentials
to be able to receive OTP emails for signup.

```bash
docker compose -f docker-compose-local.yaml up -d
```
