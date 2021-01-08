Personal site generated with hugo.

Templ:
```
{
"title": "{{ replace .Name "-" " " | title }}",
"date": "{{ .Date }}",
"draft": true,
"slug": "{{ replace .Name "-" " " }}",
"translationKey" : "{{ replace .Name "-" " " }}"
}
```
