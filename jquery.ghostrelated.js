/*!
 * @package jquery.ghostrelated
 * @version 0.2.0
 * @Copyright (C) 2014 Dane Grant (danecando@gmail.com)
 * @License MIT
 */
;(function($) {
    
    function RelatedPosts(element, options) {
        var defaults = {
                feed: '/rss',
                titleClass: '.post-title',
                tagsClass: '.post-meta',
                limit: 5,
                debug: false,
                template: '<li><a href="{url}">{title}</a></li>',
                messages: {
                    noRelated: 'No related posts were found.'
                }
            };
        this.element = element;
        this.options = $.extend({}, defaults, options);

        this.parseRss();
    };

    RelatedPosts.prototype.displayRelated = function(posts) {

        var self = this,
            count = 0;

        this._currentPostTags = this.getCurrentPostTags(this.options.tagsClass);

        var related = this.matchByTag(this._currentPostTags, posts);

        var options = this.options;

        related.forEach(function(post) {
            var template = options.template.replace(/{[^{}]+}/g, function (key) {
                return post[key.replace(/[{}]+/g, '')] || '';
            });

            if (count < self.options.limit) {
                $(self.element).append($(template));
            }
            count++;
        });

        if (count == 0) {
            $(this.element).append($('<li>' + this.messages.noRelated + '</li>'));
        }

    };

    RelatedPosts.prototype.parseRss = function() {

        $.ajax({
            url: this.options.feed
            type: 'GET'
        })
        .done(function(data, textStatus, xhr) {
          var posts = self.getPosts(data);
          self.displayRelated(posts);
        })
        .fail(function(e) {
            self.reportError(e);
        });

    };

    RelatedPosts.prototype.getCurrentPostTitle = function(titleClass) {

        if (titleClass[0] != '.') {
            titleClass = '.' + titleClass;
        }

        var postTitle = $(titleClass).text();

        if (postTitle.length < 1) {
            this.reportError("Couldn't find the post title with class: " + titleClass);
        }

        return postTitle;
    };


    RelatedPosts.prototype.getCurrentPostTags = function(tagsClass) {

        if (tagsClass[0] != '.') {
            tagsClass = '.' + tagsClass;
        }

        var tags = [];
        $(tagsClass + ' a').each(function() {
            tags.push($(this).text());
        });

        if (tags.length < 1) {
            this.reportError("Couldn't find any tags in this post");
        }

        return tags;
    };


    RelatedPosts.prototype.getPosts = function(feeds) {

        var posts = [], items = [];

        feeds.forEach(function(feed) {
            items = $.merge(items, $(feed).find('item'));
        });

        for (var i = 0; i < items.length; i++) {

            var item = $(items[i]);

            if (item.find('title').text() !== this.getCurrentPostTitle(this.options.titleClass)) {

                posts.push({
                    title: item.find('title').text(),
                    url: item.find('link').text(),
                    content: item.find('description').text(),
                    tags: $.map(item.find('category'), function(elem) {
                        return $(elem).text();
                    })
                });
            }
        }

        if (posts.length < 1) {
            this.reportError("Couldn't find any posts in feed: " + feed);
        }

        return posts;
    };


    RelatedPosts.prototype.matchByTag = function(postTags, posts) {

        var matches = [];

        posts.forEach(function(post) {

            var beenAdded = false;
            post.tags.forEach(function(tag) {

                postTags.forEach(function(postTag) {

                    if (postTag.toLowerCase() === tag.toLowerCase() && !beenAdded) {
                        matches.push(post);
                        beenAdded = true;
                    }
                });
            });
        });

        if (matches.length < 1) {
            this.reportError("There are no closely related posts");
        }

        return matches;
    };


    RelatedPosts.prototype.reportError = function(error) {
        if (this.options.debug) {
            $(this.element).append($('<li>' + error + '</li>'));
        }
    };


    $.fn.ghostRelated = function(options) {

        return this.each(function() {
            new RelatedPosts(this, options);
        });
    };


})(jQuery);