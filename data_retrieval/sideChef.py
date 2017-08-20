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
	photo = recipe_soup.find('picture')
	print picture.contents

	#steps and ingredients
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

	#star rating
	ratingList = recipe_soup.find_all('div', {"class":"w_star"})
	div = recipe_soup.find('div', {"class":"w_star"})
	star_rating = 0
	for i in div.contents:
		stringLength = len(str(i.encode('utf-8')))
		if (stringLength > 1):
			star_rating += 1
	print "star rating: " + str(star_rating)
	#author
	authorDiv = recipe_soup.find('div', {"class":"t_c w_introduce"})
	headertag = authorDiv.find('h4')
	headerList = headertag.getText().split('http')
	author = str(headerList[0].encode('utf-8'))
	print "author: " + author 
	print "---------------------------------------------------" 

	#steps and ingredients are lists containing their respective items
	#recipeName is the name of recipe
	#star rating stored in star_rating (not all recipes have ratings)
	#author stored in author


#sidechef url

#change start to number higher than the previous rows upon crash

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
		individualRecipeScrape(item.get('href')) 
	linkCount += 1
