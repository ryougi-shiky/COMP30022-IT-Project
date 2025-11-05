describe('Home Page', () => {
  const FRONTEND_URL_LOGIN = `${Cypress.config().baseUrl}/login`;
  const FRONTEND_URL_HOME = `${Cypress.config().baseUrl}/`;

  let testUser;

  before(() => {
    // Read the user data created in the register test
    cy.task('readUserData').then((userData) => {
      testUser = userData;
    });
  });

  beforeEach(() => {
    cy.visit(FRONTEND_URL_LOGIN);
    cy.get('input[placeholder="Email"]').type(testUser.email);
    cy.get('input[placeholder="Password"]').type(testUser.password);
    cy.get('[data-testid="login-button"]').click();

    cy.url().should('eq', FRONTEND_URL_HOME);
  });

  it('should render all main components of the home page', () => {
    cy.get('.topbarContainer').should('be.visible');
    cy.get('.sidebar').should('be.visible');
    cy.get('.feed').should('be.visible');
    cy.get('.rightbar').should('be.visible');
  });

  it('should render all elements in the Topbar component', () => {
    cy.get('.logo').should('be.visible').and('contain', 'Ani Ani');

    cy.get('.topbarMenu').should('be.visible').and('contain', 'Menu');

    cy.get('.searchBar').should('be.visible');
    cy.get('.searchIcon').should('be.visible');
    cy.get('.searchInput').should('be.visible')
      .and('have.attr', 'placeholder', 'Search People or Posts');

    cy.get('.topbarLinks').should('be.visible');
    cy.get('.topbarLink').should('have.length', 2);
    cy.get('.topbarLink').eq(0).should('contain', 'Home');
    cy.get('.topbarLink').eq(1).should('contain', 'Moments');

    cy.get('.topbarIcons').should('be.visible');
    cy.get('.topbarIconItem').should('have.length', 3);
    cy.get('.topbarIconBadge').should('have.length', 3);

    cy.get('.topbarImg').should('be.visible');
  });

  it('should render all elements in the Sidebar component', () => {
    cy.get('.sidebarList').should('be.visible');
    cy.get('.sidebarListItem').should('have.length', 9);

    const sidebarItems = [
      'Feed', 'Chat', 'Video', 'Groups', 'Bookmarks',
      'Questions', 'Jobs', 'Events', 'Courses'
    ];

    sidebarItems.forEach((item, index) => {
      cy.get('.sidebarListItem').eq(index).within(() => {
        cy.get('.sidebarIcon').should('be.visible');
        cy.get('.sidebarListItemText').should('be.visible').and('contain', item);
      });
    });

    cy.get('.sidebarButton').should('be.visible').and('contain', 'Show More');

    cy.get('.sidebarHr').should('be.visible');

    cy.get('.sidebarWrapper > .sidebarListItemText').should('be.visible').and('contain', 'Messages');
  });

  it('should render all elements in the Feed component', () => {
    cy.get('.share').should('be.visible');
    cy.get('.shareWrapper').should('be.visible');

    cy.get('.shareTop').should('be.visible');
    cy.get('.shareProfileImg').should('be.visible');
    cy.get('.shareInput').should('be.visible')
      .and('have.attr', 'placeholder', 'Share something here');

    cy.get('.shareBottom').should('be.visible');
    cy.get('.shareOptions').should('be.visible');
    cy.get('.shareOption').should('have.length', 4);

    const shareOptions = ['Photo or Video', 'Tag', 'Location', 'Feeling'];

    shareOptions.forEach((option, index) => {
      cy.get('.shareOption').eq(index).within(() => {
        cy.get('.shareIcon').should('be.visible');
        cy.get('.shareOptionText').should('be.visible').and('contain', option);
      });
    });

    cy.get('.shareButton').should('be.visible').and('contain', 'Share');

    cy.get('.post').should('exist');
    cy.get('.post').each(($post) => {
      cy.wrap($post).find('.postWrapper').should('be.visible');

      cy.wrap($post).find('.postTop').should('be.visible');
      cy.wrap($post).find('.postTopLeft').should('be.visible');
      cy.wrap($post).find('.postProfileImg').should('be.visible');
      cy.wrap($post).find('.postUsername').should('be.visible');
      cy.wrap($post).find('.postDate').should('be.visible');
      cy.wrap($post).find('.postTopRight').should('be.visible');
      cy.wrap($post).find('.morevert').should('be.visible');

      cy.wrap($post).find('.postCenter').should('be.visible');
      cy.wrap($post).find('.postText').should('exist');

      cy.wrap($post).find('.postBottom').should('be.visible');
      cy.wrap($post).find('.postBottomLeft').should('be.visible');
      cy.wrap($post).find('.likeIcon').should('be.visible');
      cy.wrap($post).find('.postLikeCounter').should('be.visible');
      cy.wrap($post).find('.postBottomRight').should('be.visible');
      cy.wrap($post).find('.addCommentIcon').should('be.visible');
      cy.wrap($post).find('.postCommentText').should('be.visible').and('contain', 'See Comments');
    });
  });

  it('should render all elements in the Rightbar component', () => {
    cy.get('.rightbarWrapper').should('be.visible');

    cy.get('.rightbarWrapper').then(($wrapper) => {
      if ($wrapper.find('.weatherContainer').length > 0) {
        cy.get('.weatherTitle').should('be.visible').and('contain', 'Weather Forecast');
        cy.get('.weatherDescContainer').should('be.visible');
        cy.get('.chartTitle').should('have.length.at.least', 1);
      } else {
        cy.get('.loadingWeatherNotify').should('be.visible').and('contain', 'Loading weather');
      }
    });
  });

  it('should test the functionality of the search bar', () => {
    cy.get('.searchIcon').click();

    cy.get('.searchInput').type('test');

    cy.get('.searchIcon').click();

    cy.get('.searchResultsWindowWrapper').should('be.visible');
    cy.get('.searchResultUserLine').should('be.visible');
  });

  it('should test the functionality of the Menu dropdown', () => {
    cy.get('.topbarMenu').should('be.visible').trigger('mouseover');

    cy.get('.rc-dropdown').should('be.visible');
    cy.get('.rc-menu-item').should('have.length', 2);
    cy.get('.rc-menu-item').eq(0).should('contain', 'Account');
    cy.get('.rc-menu-item').eq(1).should('contain', 'Log Out');
  });

  it('should test the functionality of the notification icon', () => {
    cy.get('.topbarIconItem').eq(2).should('be.visible').click();

    cy.get('.rc-dropdown').should('be.visible');
    cy.get('.notificationWrapper').should('exist');
  });

  it('should test the functionality of the Share component', () => {
    cy.get('.shareInput').type('Test post from Cypress');

    cy.get('.shareButton').click();

    cy.get('.post').first().find('.postText').should('contain', 'Test post from Cypress');
  });

  it('should test the functionality of post interactions', () => {
    cy.get('.post').first().within(() => {
      const likeCounter = cy.get('.postLikeCounter');
      likeCounter.invoke('text').then((text) => {
        const initialLikes = parseInt(text.split(' ')[0]);

        cy.get('.likeIcon').click();

        cy.get('.postLikeCounter').should(($counter) => {
          const newText = $counter.text();
          const newLikes = parseInt(newText.split(' ')[0]);

          expect(Math.abs(newLikes - initialLikes)).to.equal(1);
        });
      });

      cy.get('.addCommentIcon').click();
      cy.get('.commentTextbox').should('be.visible');
      cy.get('.commentTextbox').type('Test comment from Cypress');
      cy.get('.commentTextboxButton').click();

      cy.get('.postCommentText').click();
      cy.get('.postBottomCommentList').should('be.visible');
    });
  });
});
