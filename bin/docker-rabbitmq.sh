#!/bin/bash

if [ "$_PRELUDE_" != "true" ]; then
  source "${PWD}/bin/prelude.sh"
fi

if [[ "$2" != "" ]]; then
  mode="$2"
else
  mode="dev"
fi

baseName="rabbitmq_${mode}"
netName="${baseName}_net"
data="${ROOT_FOLDER}/data/${mode}/rabbitmq"
image="rabbitmq:3-management"

#---------------------------------------#

if [ "$(docker ps -a -f name=${baseName} | grep -i rabbitmq)" == "" ]; then
  let running=0
else
  let running=-1
fi

function runDocker {

  # TODO - get user and password from env
  docker run -d --name="${baseName}" --hostname="${baseName}" --net="${netName}" -p 5672:5672 -p 15672:15672 \
    -e RABBITMQ_DEFAULT_USER=root \
    -e RABBITMQ_DEFAULT_PASS=xxxxxx \
    -v "${data}/${name}:/var/lib/rabbitmq" ${image}

}

function start {
  if [ $running == 0 ]; then
    echo "++++++ starting $baseName ++++++"
    docker pull "${image}"
    docker network create -d bridge "${netName}" &> /dev/null
    runDocker
    echo "RabbitMQ is running on http://localhost:15672"
  fi
}

function stop {
  echo "------ stopping $baseName ------"
  docker stop $baseName &> /dev/null
  docker rm -v $baseName &> /dev/null
}

if [ "$1" == "start" ]; then
  start
elif [ "$1" == "stop" ]; then
  stop
else
  if [ $running == 0 ]; then
    start
  else
    stop
  fi
fi
