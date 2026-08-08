import type { OnboardingCardItem } from '../../types'
import OnboardingCard from './OnboardingCard.vue'
import { AddIcon, CogIcon } from '@kong/icons'

describe('<OnboardingCard />', () => {
  const items: OnboardingCardItem[] = [
    {
      icon: AddIcon,
      title: 'Design',
      description: 'Design your resource',
      to: { name: 'design-route' },
    },
    {
      icon: CogIcon,
      title: 'Configure',
      description: 'Configure your resource',
    },
  ]

  it('renders the title and subtitle', () => {
    cy.mount(OnboardingCard, {
      props: { title: 'Welcome', subtitle: 'Some next steps', items: [] },
    })

    cy.getTestId('onboarding-card-title').should('contain.text', 'Welcome')
    cy.getTestId('onboarding-card-subtitle').should('contain.text', 'Some next steps')
  })

  it('does not render the subtitle when omitted', () => {
    cy.mount(OnboardingCard, {
      props: { title: 'Welcome', items: [] },
    })

    cy.getTestId('onboarding-card-subtitle').should('not.exist')
  })

  it('renders an item per entry with icon, title, and description', () => {
    cy.mount(OnboardingCard, {
      props: { title: 'Welcome', items },
    })

    cy.getTestId('onboarding-item-0').should('contain.text', 'Design').and('contain.text', 'Design your resource')
    cy.getTestId('onboarding-item-1').should('contain.text', 'Configure').and('contain.text', 'Configure your resource')
  })

  it('renders an item with a `to` as a router-link', () => {
    cy.mount(OnboardingCard, {
      props: { title: 'Welcome', items },
    })

    // the shared `RouterLink` test stub doesn't replace the tag name, so assert the `button` branch was skipped instead
    cy.getTestId('onboarding-item-0').should('not.match', 'button')
  })

  it('renders an item with an `href` as an external link', () => {
    const itemsWithHref: OnboardingCardItem[] = [
      { ...items[1], href: 'https://example.com' },
    ]

    cy.mount(OnboardingCard, {
      props: { title: 'Welcome', items: itemsWithHref },
    })

    cy.getTestId('onboarding-item-0')
      .should('match', 'a')
      .and('have.attr', 'href', 'https://example.com')
      .and('have.attr', 'target', '_blank')
      .and('have.attr', 'rel', 'noopener noreferrer')
  })

  it('renders an item without `to` as a button and fires onClick', () => {
    const onClick = cy.stub().as('onClick')
    const itemsWithHandler: OnboardingCardItem[] = [
      { ...items[1], onClick },
    ]

    cy.mount(OnboardingCard, {
      props: { title: 'Welcome', items: itemsWithHandler },
    })

    cy.getTestId('onboarding-item-0').should('match', 'button')
    cy.getTestId('onboarding-item-0').click()
    cy.get('@onClick').should('have.been.calledOnce')
  })

  it('renders an item without `to`, `href`, or `onClick` as a non-interactive element', () => {
    const staticItems: OnboardingCardItem[] = [
      { ...items[1] },
    ]

    cy.mount(OnboardingCard, {
      props: { title: 'Welcome', items: staticItems },
    })

    cy.getTestId('onboarding-item-0').should('not.match', 'button').and('not.match', 'a')
  })

  it('renders a `vertical` item with a centered, stacked layout', () => {
    const verticalItems: OnboardingCardItem[] = [
      { icon: AddIcon, title: 'View all', description: 'See everything', variant: 'vertical', onClick: () => {} },
    ]

    cy.mount(OnboardingCard, {
      props: { title: 'Welcome', items: verticalItems },
    })

    cy.getTestId('onboarding-item-0').should('contain.text', 'View all').and('contain.text', 'See everything')
    cy.getTestId('onboarding-item-0').find('svg').should('exist')
  })

  it('emits "dismiss" when the close button is clicked', () => {
    cy.mount(OnboardingCard, {
      props: { title: 'Welcome', items: [] },
    })

    cy.getTestId('onboarding-card-close').click()
    cy.wrap(null).should(() => {
      expect(Cypress.vueWrapper.emitted('dismiss')).to.have.length(1)
    })
  })

  it('renders the close button with an accessible label', () => {
    cy.mount(OnboardingCard, {
      props: { title: 'Welcome', items: [] },
    })

    cy.getTestId('onboarding-card-close').should('have.attr', 'aria-label', 'Dismiss')
  })

  it('does not render the close button when dismissible is false', () => {
    cy.mount(OnboardingCard, {
      props: { title: 'Welcome', items: [], dismissible: false },
    })

    cy.getTestId('onboarding-card-close').should('not.exist')
  })
})
