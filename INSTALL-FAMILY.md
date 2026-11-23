# Installing it on your LG TV

About 20 minutes the first time, with a laptop (Mac or Windows) on the same Wi-Fi as the TV. Nothing on the TV is
removed, and it can be undone in a minute.

**You need:** an LG TV from about 2018 on (webOS 4 or newer), the TV remote, and a laptop.

## 1. On the TV: turn on Developer Mode

1. Make an LG developer account (free) at **webostv.developer.lge.com**, on your phone or laptop.
2. On the TV, open the **LG Content Store** (or **Apps**), search for **Developer Mode**, and install it.
3. Open **Developer Mode** on the TV and sign in with that account.
4. Switch **Dev Mode Status** on. The TV restarts.
5. Open **Developer Mode** again and switch **Key Server** on. Leave this screen open: it shows the TV's **IP**
   address and a **passphrase**, which you need in a moment.

## 2. On the laptop: install it

1. Download **webOS Dev Manager** from **github.com/webosbrew/dev-manager-desktop/releases** (the `.dmg` for a Mac,
   the `x64 .msi` for Windows) and open it.
2. Click **Add device**, and type the IP and passphrase from the TV.
3. Download **FreeMyTV-webos.ipk** from this project's **Releases** page (the newest one).
4. In Dev Manager, click **Install** and pick that file. In a minute it's on the TV.

## 3. On the TV: make it yours

Open **Free My TV** from the TV's apps.
Press any button to open the menu, then **Settings**:

- **City**: yours, for the weather, the sunset and the night sky.
- **Screensaver after dark**: the live sky over your city, or space photos.
- The menu's **Wi-Fi** item: type your guest network once; visitors scan the QR code to join.

## Keeping it working

Developer Mode only lasts a few weeks at a time. When it runs out, LG removes the app, and you'd have to install
it again. To keep it going, once a month either:

- open **Developer Mode** on the TV and press **Extend**, or
- open **webOS Dev Manager** on the laptop and click **Renew session** on the TV's page.

(Whoever set this up for you may have set the renewal to happen on its own. Ask them.)

## Undo

In webOS Dev Manager, pick **Free My TV** in the app list and **Remove**. Or switch Developer Mode off on the TV:
everything installed this way goes with it.
