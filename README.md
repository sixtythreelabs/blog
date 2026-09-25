_Designed by human_
_Coded slop by AI_

## Run Locally

First, run the development server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the website.

## Run on server

Run the `register-service.sh` script to build and install the service file. Might need to run with sudo to allow installing the systemd/launchctl service:

```bash
# From project root
cd scripts
chmod +x register-service.sh
./register-service.sh
```
