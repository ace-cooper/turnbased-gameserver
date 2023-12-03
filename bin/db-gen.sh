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

rm -rf $ROOT_FOLDER/prisma/migrations

npx prisma migrate dev --name '_mg' --create-only

npx ts-node $ROOT_FOLDER/prisma/pre-seed.ts

npx prisma db push

npx ts-node $ROOT_FOLDER/prisma/seed.ts

