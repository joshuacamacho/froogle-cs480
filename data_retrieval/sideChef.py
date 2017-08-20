###How this works###
#	1. First we go to the sidechef page that has all the recipes linked
#	2. We download the page in html
#	3. We then go through the page and gather all the links to the individual recipees
#	4. Upon each link, go to method individualRecipeScrape and download it
#	5. Retrieve information same way we got the links






import bs4
import urllib2
from bs4 import BeautifulSoup as soup
from urllib2 import HTTPError

def individualRecipeScrape(link):
	#get recipe link url
	recipeUrl = 'https://www.sidechef.com' + link
	headers = { 'User-Agent' : 'Mozilla/5.0' }
	req = urllib2.Request(recipeUrl, None, headers)
	recipe_html = urllib2.urlopen(req).read()
	#parse page to html and store in page_soup
	recipe_soup = soup(recipe_html, "html.parser")
	print recipe_soup.find_all('p')


#sidechef url
page = 'https://www.sidechef.com/search/query/?q=Beginner&start=12&rows=100'
#open page with firefox
headers = { 'User-Agent' : 'Mozilla/5.0' }
req = urllib2.Request(page, None, headers)
page_html = urllib2.urlopen(req).read()
#parse page to html and store in page_soup
page_soup = soup(page_html, "html.parser")
linkCount = 0
for item in page_soup.find_all('a'):
	if linkCount > 5:
		print item.get('href')
		individualRecipeScrape(item.get('href')) 
	linkCount = linkCount + 1
