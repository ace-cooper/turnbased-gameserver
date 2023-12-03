#!/bin/bash

if [ "$_PRELUDE_" != "true" ]; then
  source "${PWD}/bin/prelude.sh"
fi

$ROOT_FOLDER/bin/stop-containers.sh $1

rm -rf $ROOT_FOLDER/prisma/migrations $ROOT_FOLDER/data/*

mkdir -p $ROOT_FOLDER/data/dev/pg
mkdir -p $ROOT_FOLDER/data/test/pg

$ROOT_FOLDER/bin/start-containers.sh $1
# $ROOT_FOLDER/bin/db-gen.sh $1

