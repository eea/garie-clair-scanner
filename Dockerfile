FROM docker:19.03.13-dind

# v13 does not have binaries yet
ENV CLAIR_SCANNER_VERSION=v12

RUN apk add --no-cache bash curl coreutils \
 &&  curl -L -o /usr/bin/clair-scanner https://github.com/arminc/clair-scanner/releases/download/$CLAIR_SCANNER_VERSION/clair-scanner_linux_amd64 \
 && chmod 777 /usr/bin/clair-scanner

RUN apk add --update nodejs npm

RUN mkdir -p /usr/src/garie-plugin
RUN mkdir -p /usr/src/garie-plugin/reports

WORKDIR /usr/src/garie-plugin

COPY package.json .

RUN apk add git dumb-init

RUN cd /usr/src/garie-plugin && npm install

COPY . .

EXPOSE 3000

RUN touch /var/run/docker.sock

VOLUME ["/usr/src/garie-plugin/reports"]
VOLUME ["/var/run/docker.sock:/var/run/docker.sock"]
VOLUME ["/cache"]

ENTRYPOINT ["/usr/src/garie-plugin/docker-entrypoint.sh"]

CMD ["/usr/bin/dumb-init", "/bin/sh", "dockerd", ";", "npm", "start"]
