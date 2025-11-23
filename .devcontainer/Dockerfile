ARG DENO_VERSION
FROM denoland/deno:bin-${DENO_VERSION} AS deno
FROM mcr.microsoft.com/devcontainers/typescript-node:24-bookworm@sha256:a13b8f84b610f4a75186ed7c077b415a4b342dfd4e3b33420b8f8f9028da0347

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
