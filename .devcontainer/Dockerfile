ARG DENO_VERSION
FROM denoland/deno:bin-${DENO_VERSION} AS deno
FROM mcr.microsoft.com/devcontainers/typescript-node:22-bookworm@sha256:2baa40a4eef3ac5b42d53acddaca3aac2e47bc30c54788f6fe299dbc5da83262

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
