# Setup

1. Ideally, Homebrew (https://brew.sh/)
1. Docker: E.g. `brew install docker --cask` and then configure the Docker app to ensure it always starts on bootup AND is available in your command line. E.g. `docker --help` works.
1. Node >= v16: E.g. Through nvm (https://github.com/nvm-sh/nvm#installing-and-updating) or something else
1. Enable node corepack: `corepack enable`
1. Install pnpm: `curl -fsSL https://get.pnpm.io/install.sh | sh -` (See https://pnpm.io/installation)
1. Install node deps at root: `pnpm install`
1. (Optional) Add convenience aliases: `node ./scripts/add-aliases.mjs`

# Begin Hacking

_Option 1:_ Use one of the dev alises, like `devacspa`

_Option 2:_ Do the manual equivalent of the above with: `pnpm turbo run dev --filter ac-spa...` to run the dev scripts for ac-spa and all it's dependencies

# Deployment

1. TBD...
