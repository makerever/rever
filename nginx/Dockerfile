FROM nginx:1.28.0-alpine

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf.template /etc/nginx/nginx.conf.template

COPY ./env.sh /docker-entrypoint.sh

RUN chmod +x /docker-entrypoint.sh
# Update all environment variables
CMD ["/docker-entrypoint.sh"]
