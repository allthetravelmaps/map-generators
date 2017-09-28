usage() {
  echo "Usage: $0 [-c] [-h]"
  echo "  -c  Clean out build directory first"
  echo "  -h  Display this help message"
}

while getopts 'ch' opt; do
  case $opt in
    c)
      clean=true
      ;;
    h)
      usage
      exit 0
      ;;
    *)
      usage
      exit 1
      ;;
  esac
done
