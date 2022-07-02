# Acme Corp Marketing Website

A Wordpress website. The commited code in this repo IS NOT the source of truth for the marketing website. However, when we want to hack locally and deploy our changes, we can do so by doing the following:

1. Download and install [localwp](https://localwp.com/)
2. Setup your WP Engine API credentials (talk to someone with admin access)
3. Pull down the website locally with the advanced configuration option to download the wordpress files to the folder in this directory: `wordpress-sync`
4. Make your changes. Make sure the website still works well locally.
5. Inspect the diff changes. Make sure they all look good.
6. Push the changes back to WP Engine using LocalWP. Typically only push the code changes, because data changes could have been made by marketers while you were hacking.
