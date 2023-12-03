#!/bin/bash

if [ "$_PRELUDE_" != "true" ]; then
  source "${PWD}/bin/prelude.sh"
fi

if [ "$1" != "" ]; then
  mode=$1
else
  mode=$ENV_MODE
fi

if [[ "$mode" != "" ]]; then
  source $ROOT_FOLDER/.env.$mode
else
  source $ROOT_FOLDER/.env
fi

echo "Updating prisma schema"

npx prisma db pull