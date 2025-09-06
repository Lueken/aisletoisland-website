import {defineField, defineType} from 'sanity'

export default defineType({
    name: 'post',
    title: 'Blog Post',
    type: 'document',
    fields: [
        defineField({
            name: 'title',
            title: 'Title',
            type: 'string',
            validation: (rule) => rule.required()
        }),
        defineField({
            name: 'slug',
            title: 'Slug',
            type: 'slug',
            options: {
                source: 'title',
                maxLength: 96
            },
            validation: (rule) => rule.required()
        }),
        defineField({
            name: 'excerpt',
            title: 'Excerpt',
            type: 'text',
            rows: 4,
            description: 'Short description for blog listing and meta tags'
        }),
        defineField({
            name: 'mainImage',
            title: 'Main Image',
            type: 'image',
            options: {
                hotspot: true
            },
            fields: [
                {
                    name: 'alt',
                    title: 'Alternative Text',
                    type: 'string',
                    description: 'Important for SEO and accessibility'
                }
            ]
        }),
        defineField({
            name: 'category',
            title: 'Category',
            type: 'reference',
            to: [{type: 'category'}]
        }),
        defineField({
            name: 'author',
            title: 'Author',
            type: 'reference',
            to: [{type: 'author'}]
        }),
        defineField({
            name: 'publishedAt',
            title: 'Published At',
            type: 'datetime'
        }),
        defineField({
            name: 'featured',
            title: 'Featured Post',
            type: 'boolean',
            description: 'Show this post prominently on the blog page'
        }),
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
                },
                // Add image support with formatting options
                {
                    type: 'image',
                    fields: [
                        {
                            name: 'alt',
                            title: 'Alternative Text',
                            type: 'string',
                            description: 'Important for SEO and accessibility',
                            validation: (rule: any) => rule.required()
                        },
                        {
                            name: 'caption',
                            title: 'Caption',
                            type: 'string',
                            description: 'Optional caption displayed below the image'
                        },
                        {
                            name: 'alignment',
                            title: 'Image Alignment',
                            type: 'string',
                            options: {
                                list: [
                                    {title: 'Left', value: 'left'},
                                    {title: 'Center', value: 'center'},
                                    {title: 'Right', value: 'right'},
                                    {title: 'Full Width', value: 'full'}
                                ]
                            },
                            initialValue: 'center'
                        },
                        {
                            name: 'size',
                            title: 'Image Size',
                            type: 'string',
                            options: {
                                list: [
                                    {title: 'Small (300px)', value: 'small'},
                                    {title: 'Medium (600px)', value: 'medium'},
                                    {title: 'Large (900px)', value: 'large'},
                                    {title: 'Full Width', value: 'full'}
                                ]
                            },
                            initialValue: 'medium'
                        }
                    ]
                }
            ]
        }),
        // ... other fields ...
    ],
})