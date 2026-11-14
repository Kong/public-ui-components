// Cypress 16 considers offscreen elements visible. Check the mobile sidebar's
// position explicitly so these assertions still verify it is outside the viewport.
export const expectLeftOfViewport = ($elements: JQuery<HTMLElement>) => {
  for (const element of $elements) {
    expect(element.getBoundingClientRect().right, 'right edge outside the viewport').to.be.at.most(0)
  }
}
