# GitHub Workflows

## Docker Publish Workflow

The project includes automated Docker image building and publishing to GitHub Container Registry (ghcr.io).

### Automatic Publishing

The `docker-publish.yml` workflow automatically builds and publishes Docker images when:

- Code is pushed to `master` or `main` branches
- A new Git tag is created (e.g., `v1.0.0`)

**Tags generated:**
- `latest` - For pushes to master/main
- `v1.0.0` - For semantic version tags
- `v1.0` - Minor version tag
- `v1` - Major version tag
- `sha-abc123` - Commit SHA tag
- Branch name - For feature branches

### Manual Publishing

Use `docker-publish-manual.yml` to manually trigger a build:

1. Go to **Actions** tab in GitHub
2. Select **Manual Docker Publish**
3. Click **Run workflow**
4. Enter the tag you want to publish
5. Optionally specify platforms (default: `linux/amd64,linux/arm64`)

### Image URL

After publishing, the image is available at:

```
ghcr.io/<username>/fast-translate:<tag>
```

Example:
```bash
docker pull ghcr.io/azimkin/fast-translate:latest
```

### Running the Image

```bash
docker run -d \
  -p 4321:4321 \
  -e OLLAMA_API_ENDPOINT=http://host.docker.internal:11434 \
  ghcr.io/<username>/fast-translate:latest
```

### Security Scanning

The workflow includes Trivy vulnerability scanning:
- Scans the built image for known vulnerabilities
- Uploads results to GitHub Security tab
- Fails the build if critical vulnerabilities are found

### Multi-Platform Builds

Images are built for:
- `linux/amd64` (Intel/AMD)
- `linux/arm64` (ARM, Apple Silicon, Raspberry Pi)

### Cache

The workflow uses GitHub Actions cache to speed up builds:
- Bun dependencies are cached
- Docker layers are cached between builds

### Required Permissions

The workflow requires these permissions (granted by default):
- `contents: read` - To checkout code
- `packages: write` - To publish to GHCR
- `security-events: write` - To upload Trivy results

### Customization

To customize the workflow:

1. **Change registry**: Update `REGISTRY` env variable
2. **Add platforms**: Modify `platforms` in build step
3. **Disable scanning**: Remove Trivy steps
4. **Change build args**: Add to `build-args` section

### Troubleshooting

**Build fails:**
- Check the Actions tab for detailed logs
- Verify Dockerfile is valid
- Ensure all dependencies install correctly

**Authentication fails:**
- Verify `GITHUB_TOKEN` secret is available (automatic)
- Check repository permissions allow package writes

**Image not found:**
- Ensure the workflow completed successfully
- Check the package is public (or you're authenticated)
- Verify the tag name is correct
