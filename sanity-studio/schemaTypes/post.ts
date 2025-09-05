import {defineField, defineType} from 'sanity'

export default defineType({
    name: 'post',
    title: 'Blog Post',
    type: 'document',
    fields: [
        // ... other fields ...
        defineField({
            name: 'body',
            title: 'Body',
            type: 'array',
            of: [
                {
                    type: 'block',
                    marks: {
                        decorators: [
                            {title: 'Strong', value: 'strong'},
                            {title: 'Emphasis', value: 'em'},
                            {title: 'Underline', value: 'underline'},
                            {title: 'Strike', value: 'strike-through'},
                            {title: 'Code', value: 'code'}
                        ],
                        annotations: [
                            {
                                title: 'URL',
                                name: 'link',
                                type: 'object',
                                fields: [
                                    {
                                        title: 'URL',
                                        name: 'href',
                                        type: 'url'
                                    }
                                ]
                            }
                        ]
                    },
                    styles: [
                        {title: 'Normal', value: 'normal'},
                        {title: 'H1', value: 'h1'},
                        {title: 'H2', value: 'h2'},
                        {title: 'H3', value: 'h3'},
                        {title: 'H4', value: 'h4'},
                        {title: 'Quote', value: 'blockquote'}
                    ],
                    lists: [
                        {title: 'Bullet', value: 'bullet'},
                        {title: 'Numbered', value: 'number'}
                    ]
                }
            ]
        }),
        // ... other fields ...
    ],
})