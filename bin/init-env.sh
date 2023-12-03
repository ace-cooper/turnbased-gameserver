#!/bin/bash

if [ "$_PRELUDE_" != "true" ]; then
  source "${PWD}/bin/prelude.sh"
fi

if [[ ! -f "$ROOT_FOLDER/.env" ]]; then
    echo "export NODE_ENV=DEV" >> $ROOT_FOLDER/.env
    echo "export DATABASE_URL=\"postgresql://root:xxxxxx@localhost:26257/defaultdb\"" >> $ROOT_FOLDER/.env
fi

if [[ ! -f "$ROOT_FOLDER/.env.stage" ]]; then
    echo "export NODE_ENV=STAGE" >> $ROOT_FOLDER/.env
    echo "export DATABASE_URL=\"postgresql://root:xxxxxx@localhost:26257/defaultdb\"" >> $ROOT_FOLDER/.env.stage
fi

if [[ ! -f "$ROOT_FOLDER/.env.test" ]]; then
    echo "export NODE_ENV=TEST" >> $ROOT_FOLDER/.env
    echo "export DATABASE_URL=\"postgresql://root:xxxxxx@localhost:26257/defaultdb\"" >> $ROOT_FOLDER/.env.test
fi