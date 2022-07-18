thisrealpath() {
    local PRG="$0"
    while [ -h "$PRG" ] ; do
      PRG=`readlink "$PRG"`
    done
    local scriptdir=`dirname "$PRG"`
    (cd "$(dirname "$scriptdir")"; printf "%s/%s\n" "$(pwd)" "$(basename "$scriptdir")")
}

node --experimental-vm-modules --no-warnings --experimental-loader "$(thisrealpath)/dist/loader.js" "$(thisrealpath)/dist/cli.js" $@