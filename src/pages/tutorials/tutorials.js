export default {
  loops: {
    title: 'Loops',
    description: 'Loops are a way to repeat a block of code multiple times.',
    level: 'beginner',
    time: '5 minutes',
    category: 'basics',
    steps: [
      {
        title: 'For ... of',
        content: 'The for tag with an of attribute is used to loop through an array.',
        before: [{ 
          name:"index.marko", 
          path:"/components/index.marko", 
          content:"<ul>\n  <li>One</li>\n  <li>Two</li>\n  <li>Three</li>\n</ul>"
        }],
        after: [{ 
          name:"index.marko", 
          path:"/components/index.marko", 
          content:`<ul>\n  <for|text| of=["One", "Two", "Three"]>\n    <li>\${text}</li>\n  </for>\n</ul>`
        }],
      },
      {
        title: 'For ... in',
        content: 'The for tag with an in attribute is used to loop through an object\'s keys.',
        before: [{ 
          name:"index.marko", 
          path:"/components/index.marko", 
          content:`<ul>\n  <li>One: 1</li>\n  <li>Two: 2</li>\n  <li>Three: 3</li>\n</ul>`
        }],
        after: [{ 
          name:"index.marko", 
          path:"/components/index.marko", 
          content:`<ul>\n  <for|key, value| in={"One": 1, "Two": 2, "Three": 3}>\n    <li>\${key}: \${value}</li>\n  </for>\n</ul>`
        }],
      }
    ]
  }
}