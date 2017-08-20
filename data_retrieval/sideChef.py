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
	steps = []
	ingredients = []
	#get recipe link url
	recipeUrl = 'https://www.sidechef.com' + link
	headers = { 'User-Agent' : 'Mozilla/5.0' }
	req = urllib2.Request(recipeUrl, None, headers)
	recipe_html = urllib2.urlopen(req).read()
	#parse page to html and store in page_soup
	recipe_soup = soup(recipe_html, "html.parser")
	pList = recipe_soup.find_all('p')
	counter = 0
	endIngredients = False 
	for item in pList[:-4]:
		#Title is at first p
		if counter == 0:
			recipeName = item.getText()
			print "recipe name: " + recipeName
		if counter > 2:
			if item.getText()[0].isdigit():
				print "ingredients: " + item.getText()
				ingredients.append(item.getText())
			else: 
				print "steps: " + item.getText().lstrip()
				steps.append(item.getText().lstrip())

		counter += 1

	#Enter items in database here:
	#steps and ingredients are lists containing their respective items
	#recipeName is the name of recipe



#sidechef url

#change start to number higher than the previous rows upon crash
start = 12
rows = start + 100

page = 'https://www.sidechef.com/search/query/?q=Beginner&start=' + start + '&rows=' + rows
#open page with firefox
headers = { 'User-Agent' : 'Mozilla/5.0' }
req = urllib2.Request(page, None, headers)
page_html = urllib2.urlopen(req).read()
#parse page to html and store in page_soup
page_soup = soup(page_html, "html.parser")
linkCount = 0
for item in page_soup.find_all('a'):
	if linkCount > 5:
		individualRecipeScrape(item.get('href')) 
	linkCount += 1
