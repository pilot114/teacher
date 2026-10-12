FROM golang:1.26-alpine AS build

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
# sqlite здесь чистый Go, поэтому обходимся без cgo и получаем статический бинарник
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /teacher-api .

FROM alpine:3.20

RUN adduser -D -u 10001 app && mkdir -p /data && chown app /data
COPY --from=build /teacher-api /usr/local/bin/teacher-api

USER app
WORKDIR /data
VOLUME /data

ENV DB_PATH=/data/teacher.db
ENV PORT=8090
EXPOSE 8090

CMD ["teacher-api"]
