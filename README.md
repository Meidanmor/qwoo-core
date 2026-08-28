# QWoo Core

QWoo Core is the WordPress/WooCommerce backend plugin for [QWoo](https://github.com/Meidanmor/qwoo).

It provides the WordPress and WooCommerce integration required to run a headless QWoo storefront, including authentication, customer accounts, WooCommerce data, REST API endpoints, wishlist support, push notifications, SEO metadata, and optional synchronization with GitHub.

## Requirements

* WordPress 6.5+
* WooCommerce
* PHP 8.1+
* PHP OpenSSL extension
* A QWoo frontend

QWoo Core requires WooCommerce to be installed and active.

## Installation

1. Download the latest QWoo Core release.
2. In WordPress, go to **Plugins → Add New → Upload Plugin**.
3. Upload the `qwoo-core.zip` file.
4. Install and activate the plugin.
5. Open the QWoo settings in the WordPress admin.
6. Configure the required backend and frontend settings.

The plugin performs an activation-time check for PHP 8.1+ and the OpenSSL extension.

## What QWoo Core Provides

### Headless WooCommerce integration

QWoo Core extends WooCommerce's Store API for use with a headless storefront and provides additional QWoo-specific data and functionality.

This includes:

* Product metadata
* Product category information
* Customer orders
* Wishlist functionality
* Customer account information
* Headless checkout integration
* Additional product sorting and rating metadata

### Authentication

QWoo Core provides REST endpoints for:

* Login
* Logout
* Current user information
* Profile updates
* Authentication nonce generation
* Google authentication

Authentication uses WordPress's native logged-in session cookies rather than requiring a separate JWT authentication system.

### Google Login

QWoo Core supports Google authentication through Google's OAuth/identity endpoints.

Google credentials are configured through the QWoo technical settings, including:

* Google Client ID
* Google Client Secret
* Google Redirect URI

Google ID tokens are validated server-side before the corresponding WordPress user is authenticated or created.

### Wishlist

Authenticated customers can manage their wishlist through QWoo's REST API.

Wishlist data is stored against the customer's WordPress account and returned with relevant WooCommerce product information.

### SEO metadata

QWoo Core provides a REST endpoint for retrieving SEO metadata for headless routes.

It supports:

* Pages
* Posts
* Products
* WooCommerce shop pages
* Product categories
* Yoast SEO metadata when Yoast SEO is available

The plugin also provides sensible fallback metadata when an SEO plugin is not being used.

### Push notifications

QWoo Core provides backend support for PWA/web push subscriptions, including:

* Saving subscriptions
* Updating subscriptions
* Removing subscriptions
* Device identification
* Cart association
* Cart activity timestamps

Push subscriptions are stored in a dedicated WordPress database table created during plugin activation.

### Product and content synchronization

QWoo Core can synchronize WooCommerce data to a GitHub repository.

Depending on the configured QWoo setup, this can include:

* Products
* Product categories
* Price metadata
* Homepage configuration
* Homepage hero images

Product synchronization can be triggered by WooCommerce product changes and through scheduled background synchronization.

GitHub synchronization requires a GitHub repository and access token to be configured in the QWoo technical settings.

### Abandoned cart support

QWoo Core includes infrastructure for tracking cart activity and triggering abandoned-cart processing through an external cron endpoint.

The plugin generates a unique secret for the cron endpoint and exposes the configured URL through the QWoo technical settings.

## Configuration

After activation, configure QWoo Core from the WordPress admin.

Depending on the features you use, configuration may include:

### Frontend

* QWoo frontend URL
* Backend configuration
* CORS-related settings

### Google Authentication

* Google Client ID
* Google Client Secret
* Google Redirect URI

### GitHub synchronization

* GitHub repository owner
* GitHub repository name
* GitHub access token
* GitHub branch

### Push notifications

Configure the required push notification credentials and frontend integration according to the QWoo documentation.

## REST API

QWoo Core registers its custom REST API under:

`/wp-json/qwoo/v1/`

The API includes endpoints for authentication, customer accounts, orders, wishlist management, SEO metadata, push notifications, product metadata, and other QWoo functionality.

Authentication-required endpoints use the current WordPress customer session.

## Security

QWoo Core includes authentication checks and rate limiting on sensitive endpoints such as login, Google login, and push-notification operations.

For production installations:

* Use HTTPS.
* Keep WordPress, WooCommerce, PHP, and QWoo Core up to date.
* Do not expose GitHub tokens or Google client secrets.
* Keep Firebase service-account credentials outside the public web root.
* Configure your WordPress/WooCommerce email delivery through a reliable SMTP or transactional email provider.
* Use appropriate CORS configuration for your QWoo frontend.

## QWoo Frontend

QWoo Core is designed to work with the QWoo headless storefront.

QWoo:

https://github.com/Meidanmor/qwoo

## Releases

QWoo Core releases are distributed as GitHub Release ZIP packages.

Each release is generated from its corresponding Git tag and packaged with the required WordPress plugin directory structure.

## License

QWoo Core is licensed under the GNU General Public License v2.0 or later.

See the [GNU General Public License v2.0](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html) for the complete license text.

## Support

For bug reports and development issues, use the GitHub repository:

https://github.com/Meidanmor/qwoo-core/issues
