# Picnic: privacy first collaborative text editor.

Picnic is a very generic app that tries to solve one specific problem :
You are organizing a picnic with friends and need to decide who brings
what.

You could spam the WhatsApp group with messages like "I'll bring
sandwiches" and "I'll bring drinks", but it quickly gets messy and
difficult to know who brings what and what is missing.

With picnic, you just [create a document](https://picnic.lecaro.me/),
post the link in the group chat, and then edit it together.

The hosted version of this software is provided without any guarantee,
if you don't want your texts to disappear one day, I'd recommend setting
up your own instance.

## Development

Pull the source and install with `npm i` then start the
server on http://localhost:4444/ with `npm start`.

The project is auto-formatted by prettier on commit.

## Host your own

I'm using [meteor-up](http://meteor-up.com/) to deploy on my server with
the [mup node pluging](https://github.com/zodern/mup-node) but really you can
host this anywhere.

All you need is node on your server (I'm running v12.22.7 locally) and `npm i --production && npm run prod`. The data is saved in the ./data folder as json files (the actual text content is encrypted) so i'd recommend setting a volume on
that folder in Docker.

I think it could be tricky to host on heroku because the fs is ephemeral there.
I host mine on digitalocean.
