/**
 * The placements that actually exist in the apps.
 *
 * A slot only does something if client code asks for its key. Creating an
 * arbitrary new key from the admin would store a row nothing ever renders, so
 * this list — not a free-form "add" button — is what the Offers page shows.
 * Adding a genuinely new placement means shipping app code that reads the key,
 * and adding an entry here in the same change.
 *
 * `fields` drives the editor, so a banner isn't asked for badge text and a
 * badge isn't asked for a background image.
 */
const offerPlacements = [
  {
    key: 'home_banner_1',
    label: 'Homepage banner — first slide',
    description: 'Large promo panel at the top of the customer home screen.',
    fields: ['headline', 'body', 'image_url'],
    preview: 'headline',
  },
  {
    key: 'home_banner_2',
    label: 'Homepage banner — second slide',
    description: 'The second slide of the rotating home screen promo panel.',
    fields: ['headline', 'body', 'image_url'],
    preview: 'headline',
  },
  {
    key: 'workshop_card_badge',
    label: 'Workshop card badge',
    description: 'Red tag on workshop cards — home screen and the garages list.',
    fields: ['badge_text'],
    preview: 'badge_text',
  },
];

export default offerPlacements;
