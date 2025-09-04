ARG DENO_VERSION
FROM denoland/deno:bin-${DENO_VERSION} AS deno
FROM mcr.microsoft.com/devcontainers/typescript-node:22-bookworm@sha256:df90a1e397d6096285b6e0ae804c20f7c26a2234eb50245502993cf9bd1fa9e3

# Install Git and related tools
RUN apt-get update && apt-get install -y \
  git \
  git-lfs \
  && rm -rf /var/lib/apt/lists/*

RUN sudo apt-get update && sudo apt-get install gnupg2 -y

# Copy Deno binary
COPY --from=deno /deno /usr/local/bin/deno

# Configure Git
RUN git config --system core.autocrlf input \
  && git config --system core.eol lf \
  && git config --system pull.rebase false
