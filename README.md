# doitblog
A simple static blog generator

## Start

### Instal doitblog

To use doitblog you will need to install pandoc (https://pandoc.org/).


```
npm install doitblog -g
```

Check that is installed by running:

```
doitblog
```

A help message shoudl be printed.

### init blog

In this example we will create our blog on docs folder.

```
doitblog init docs
```

### Make some pages and posts

The init will create a sources folder inside the generated folder. Sources folder contains two 
folders:

* pages: where static pages are stored.
* posts: where posts are stored.

There is alredy some examples, if we serve docs folder with a webserver you can see the same website as this: https://fsvieira.github.io/doitblog/

Now delete, create or edit your own markdown files on pages and posts folder, after you are done run:

```
doitblog update
```

Before publishing make sure to customize index.html to your blog, normally you need to change:

* html header title,
* github fork me url,
* title and subtitle on the webpage,

Also don't forget to change the icon on images folder.

Thats it, you are ready to go.

### Pages and Posts as folders

You can also create pages and posts by adding a folder to pages/posts folders, and add it a index.* file, 
where * is the markdown extension, for example:

(https://github.com/fsvieira/doitblog/blob/master/docs/sources/posts/A%20post%20folder/index.tex)
```
# sources/posts/A post folder/index.tex

\documentclass{article}
\usepackage[utf8]{inputenc}
\usepackage{graphicx}

% pandoc -o gen/about.html about.tex


\begin{document}

This is a post folder, its a folder that must contain a index.* file.

A page or post folder lets us better organize posts and add resources, like images:

\includegraphics{sources/posts/A post folder/hardcoded83_mascote_by_chojin_83.png}

\end{document}

```

Then just normally run the doitblog update.
 
You may have noticed the image path is relative to sources, its because update is using pandoc to 
generate the html files and I still need to figure out how to run pandoc with relative paths.

### About generated files

Doitblog only converts sources to html and stores a database json file to be used by the website. This means 
that you can customize or even rebuild a complete different spa with your favorite framework without worrying that it will be 
overwrite by doitblog.

### Description Files

For every pages and posts files doitblog will generate a json on the same folder, this is a description file, it contains information like date, author.

This file is only generated if does not exists, so it can be edited or created by hand with the desired information.

The author field comes from the package.json author field.


### Some extras

Optinal you can run (on generated folder):

```
npm install
```

This will install some utils to serve the website and for developing the website.

After install you can run:

```
npm run dev
```
It will run a developer server to serve the website.

You can also install gulp
```
npm install gulp -g
```

After install you can run:
```
gulp watch
```

So everytime you change javascript file, it will build it. 








 
