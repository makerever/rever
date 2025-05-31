# build the container images for self-hosted runners
docker compose -f build.yaml build

# login to DockerHub
echo "Logging in to DockerHub..."
if [ -z "$DOCKER_USERNAME" ] || [ -z "$DOCKER_PASSWORD" ]; then
  echo "Error: DockerHub credentials not provided. Please set DOCKER_USERNAME and DOCKER_PASSWORD environment variables."
  echo "Example usage: DOCKER_USERNAME=yourusername DOCKER_PASSWORD=yourpassword ./build.sh"
  exit 1
fi

echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

# push the container images to DockerHub
echo "Pushing images to DockerHub..."
docker compose -f build.yaml push

# logout from DockerHub for security
echo "Logging out from DockerHub..."
docker logout
