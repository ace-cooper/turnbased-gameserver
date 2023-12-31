#!/usr/bin/env bash
if [ "$_PRELUDE_" != "true" ]; then
  source "${PWD}/bin/prelude.sh"
fi

if [[ "$2" != "" ]]; then
  mode="$2"
  source $ROOT_FOLDER/.env.$mode
else
  mode="dev"
  source $ROOT_FOLDER/.env
fi

# export ENV_MODE=$mode
echo "Starting containers..."
$ROOT_FOLDER/bin/stop-containers.sh &> /dev/null
echo "Postgres:"
$ROOT_FOLDER/bin/db-docker-postgresql.sh start $mode $DB_PORT
echo "Redis:"
$ROOT_FOLDER/bin/docker-redis.sh start $mode
echo "RabbitMQ:"
$ROOT_FOLDER/bin/docker-rabbitmq.sh start $mode

