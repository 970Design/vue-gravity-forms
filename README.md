# What is Vue Gravity Forms?

Vue Gravity Forms is a [Vue](https://vuejs.org/) 3 component which allows you to render and process [Gravity Forms](https://www.gravityforms.com/) in a headless [WordPress](https://wordpress.org/) environment via the Gravity Forms REST API.  This component will work in any environment where Vue is supported (such as [Astro.js](https://astro.build/)).  Currently, it supports all Basic and Advanced field types, confirmation messages and redirects, file uploads, multipage forms, and (optionally) Google reCAPTCHA v3.

## Setup Guide

- Install and activate the [Gravity Forms](https://www.gravityforms.com/) plugin in your headless WordPress site, and create a form.
- Activate the [Gravity Forms REST API](https://docs.gravityforms.com/gravity-forms-rest-api-settings/#h-activate-the-rest-api)
- Generate an [Application Password](https://wordpress.org/support/article/application-passwords/) for a WordPress user with permission to view and submit the form.
- Install this package in your front-end project using npm (or your favorite package manager):
    - `npm install @970design/vue-gravity-forms`
- Import and use the `VueGravityForms` component in your front-end project, passing the required props (see example below).

## Example Usage (with Astro.js)

```javascript
---
import VueGravityForms from "@970design/vue-gravity-forms";

const formId = 1;
const endpoint = 'https://my-headless-wordpress.com';
const wpUsername = my_wordpress_username;
const wpAppPassword = import.meta.env.APPLICATION_PASSWORD;
---

  <VueGravityForms
    client:load
    formId={formId}
    endpoint={endpoint}
    wpUsername={wpUsername}
    wpAppPassword={wpAppPassword}
    recaptchaKey="OPTIONAL_RECAPTCHA_KEY"
  />
```

## Props

| Prop | Type | Required | Description                                           |
|------|------|----------|-------------------------------------------------------|
| `endpoint` | string | Yes | The URL of your headless WordPress site               |
| `formId` | number | Yes | The ID of the Gravity Form to display                 |
| `wpUsername` | string | Yes | WordPress username with form access permissions       |
| `wpAppPassword` | string | Yes | Application password generated for the WordPress user |
| `recaptchaKey` | string | No | Google reCAPTCHA v3 site key (enabled if passed)      |


## Gotchas

To prevent CORS errors with the "Redirect" and "Page" form confirmation types, you must add the following code to your WordPress theme's functions.php file, or a custom plugin, to remove the `Location` header from the Gravity Forms REST API response:

```php
add_filter( 'rest_post_dispatch', 'gf_remove_redirect_header_from_api', 10, 3 );
function gf_remove_redirect_header_from_api( $response, $server, $request ) {
    if ( strpos( $request->get_route(), '/gf/v2/forms/' ) !== false && $request->get_method() === 'POST' ) {
        $headers = $response->get_headers();
        if ( isset( $headers['Location'] ) ) {
            unset( $headers['Location'] );
            $response->set_headers( $headers );
        }
    }
    return $response;
}
```

## Feature Roadmap

- Support for overriding field components
- ~~Support for multipage forms~~
- Support for Post fields
- Support for Pricing fields
- Support for Conditional Logic
- Support for Gravity Forms Add-Ons (e.g. User Registration, etc)

## More Information

The development of this package is sponsored by [970 Design](https://970design.com), a creative agency based in Vail, Colorado.  If you need help with your headless WordPress project, please don't hesitate to [reach out](https://970design.com/reach-out/).