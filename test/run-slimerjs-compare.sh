#!/bin/bash

[ -z $SLIMERJS ] && SLIMERJS=slimerjs
[ -z $GIT ] && GIT=git

PROFILE=`pwd`/profile

BASE_COMMIT=$2

if [[ -z "$BASE_COMMIT" ]]; then
  echo "Abort: No base commit set."

  exit 1
fi

if [[ ! -z $($GIT status --porcelain --u=no 2> /dev/null) ]]; then
  echo "Abort: Directory is not clean. Not running compare to prevent data loss."

  exit 1
fi

echo 'Comparing screenshots from '$BASE_COMMIT

echo 'Checking out '$BASE_COMMIT'...'
$GIT checkout --detach $BASE_COMMIT 2>/dev/null

echo 'Taking screenshots...'

mkdir -p $PROFILE

$SLIMERJS --local-storage-quota=50000000 -profile $PROFILE \
  ./test/headless-runner.js $1?savemode=true |\
  tee ./slimerjs.log

# Figure out the exit code ourselves because Gecko does not allow
# SlimerJS to do so for now.
ERROR=0
[ -z "`grep ' 0 failed.' ./slimerjs.log`" ] && ERROR=1

if [ $ERROR -ne 0 ]; then
  rm ./slimerjs.log
  rm -rf $PROFILE

  exit $ERROR
fi

echo

echo 'Go back to the previous checkout ...'
$GIT checkout - 2>/dev/null

echo 'Comparing screenshots...'

$SLIMERJS -profile $PROFILE ./test/headless-runner.js $1?allownoref=true |\
tee ./slimerjs.log

# Figure out the exit code ourselves because Gecko does not allow
# SlimerJS to do so for now.
[ -z "`grep ' 0 failed.' ./slimerjs.log`" ] && ERROR=1

rm ./slimerjs.log
rm -rf $PROFILE

exit $ERROR
