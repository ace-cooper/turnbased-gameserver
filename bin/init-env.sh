#!/bin/bash

if [ "$_PRELUDE_" != "true" ]; then
  source "${PWD}/bin/prelude.sh"
fi

if [[ ! -f "$ROOT_FOLDER/.env" ]]; then
    echo "export NODE_ENV=DEV" >> $ROOT_FOLDER/.env
    echo "export DATABASE_URL=\"postgresql://root:xxxxxx@localhost:5432/defaultdb\"" >> $ROOT_FOLDER/.env
    echo "export DB_PORT=5432" >> $ROOT_FOLDER/.env
    echo "export CACHE_PORTS=\"6379 6380 6381\"" >> $ROOT_FOLDER/.env
    echo "export CACHE_URL='[\"redis://localhost:6379\",\"redis://localhost:6380\",\"redis://localhost:6381\"]'" >> $ROOT_FOLDER/.env
fi

if [[ ! -f "$ROOT_FOLDER/.env.stage" ]]; then
    echo "export NODE_ENV=STAGE" >> $ROOT_FOLDER/.env.stage
    echo "export DATABASE_URL=\"postgresql://root:xxxxxx@localhost:5432/defaultdb\"" >> $ROOT_FOLDER/.env.stage
    echo "export DB_PORT=5432" >> $ROOT_FOLDER/.env.stage
    echo "export CACHE_PORTS=\"6382 6383 6384\"" >> $ROOT_FOLDER/.env.stage
    echo "export CACHE_URL='[\"redis://localhost:6382\",\"redis://localhost:6383\",\"redis://localhost:6384\"]'" >> $ROOT_FOLDER/.env.stage    
fi

if [[ ! -f "$ROOT_FOLDER/.env.test" ]]; then
    echo "export NODE_ENV=TEST" >> $ROOT_FOLDER/.env.test
    echo "export DATABASE_URL=\"postgresql://root:xxxxxx@localhost:5432/defaultdb\"" >> $ROOT_FOLDER/.env.test
    echo "export DB_PORT=5432" >> $ROOT_FOLDER/.env.test
    echo "export CACHE_PORTS=\"6385\"" >> $ROOT_FOLDER/.env.test
    echo "export CACHE_URL='[\"redis://localhost:6385\"]'" >> $ROOT_FOLDER/.env.test    
fi