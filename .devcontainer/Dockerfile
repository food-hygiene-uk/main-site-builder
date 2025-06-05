ARG DENO_VERSION
FROM denoland/deno:bin-${DENO_VERSION} AS deno
FROM mcr.microsoft.com/devcontainers/typescript-node:22-bookworm@sha256:7c2e711a4f7b02f32d2da16192d5e05aa7c95279be4ce889cff5df316f251c1d

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
