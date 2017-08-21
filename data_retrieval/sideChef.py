###How this works###
#	1. First we go to the sidechef page that has all the recipes linked
#	2. We download the page in html
#	3. We then go through the page and gather all the links to the individual recipees
#	4. Upon each link, go to method individualRecipeScrape and download it
#	5. Retrieve information same way we got the links


#####Disclaimer:
#This is the ugliest/hackiest code Ive ever written. I apologize.

import bs4
import re
import time
import urllib2
from bs4 import BeautifulSoup as soup
from urllib2 import HTTPError
import boto
from boto.dynamodb2.table import Table
import json
from collections import namedtuple
from collections import defaultdict



def individualRecipeScrape(link):
	steps = []
	ingredients = []
	ingredient_amounts = []
	step_photos = []
	#get recipe link url
	recipeUrl = 'https://www.sidechef.com' + link
	headers = { 'User-Agent' : 'Mozilla/5.0' }
	req = urllib2.Request(recipeUrl, None, headers)
	recipe_html = urllib2.urlopen(req).read()
	#parse page to html and store in page_soup
	recipe_soup = soup(recipe_html, "html.parser")
	photo = recipe_soup.find('picture').encode('utf-8')
	photo_link = str(photo).split('\"')[5]
	print "photo link: " + photo_link

	#steps and ingredients
	p_list = recipe_soup.find_all('p')
	counter = 0
	end_ingredients = False 
	recipe_name = str(p_list[0].getText())
	print("recipe name: " + recipe_name)
	#ingredients

	ingredient_list = recipe_soup.find('div', {"class":"w_95 w_Ingred"})
	ingredient_list = ingredient_list.find_all('strong')
	for strong in ingredient_list:
		print "ingredients: " + strong.getText()
		ingredient_amounts.append(strong.getText())
		print "steps: " + str(strong.next_sibling)
		ingredients.append(str(strong.next_sibling))


	#steps
	step_list = recipe_soup.find('div', {"class":"w_details"})
	photo_list = step_list.find_all('img')
	for photo in photo_list:
		step_photos.append(str(photo_list).split('\"')[1])
		print step_photos
	rec_steps = step_list.find_all('p')
	for step in rec_steps:
		steps.append(step.getText().lstrip())
		print "step: " + step.getText().lstrip()

	#star rating
	div = recipe_soup.find('div', {"class":"w_star"})
	star_rating = 0
	for i in div.contents:
		string_length = len(str(i.encode('utf-8')))
		if (string_length > 1):
			star_rating += 1
	print "star rating: " + str(star_rating)
	#author
	author_div = recipe_soup.find('div', {"class":"t_c w_introduce"})
	header_tag = author_div.find('h4')
	header_list = header_tag.getText().split('http')
	author = str(header_list[0].encode('utf-8'))
	print "author: " + author 
	print "---------------------------------------------------" 

	#steps and ingredients are lists containing their respective items
	#ingredient_amounts[] has ingredient amounts
	#recipe_name is the name of recipe
	#star rating stored in star_rating (not all recipes have ratings)
	#author stored in author
	#photo link stored in photo_link
	#step photos stored in "step_photo"
	#steps = {{text: "", imageurl: ""}, }
	counter = 0
	step_dict = []
	for step in steps:
		img = ""
		try:
			img = step_photos[counter]
		except IndexError:
			img = ""
		step_dict.append({"text" : step.rstrip(), "imageurl": img})
		counter+=1
	print step_dict

	counter = 0
	ingr_dict = []
	for ingred in ingredients:
		pls = ingredient_amounts[counter]
		print pls
		ingr_dict.append({"name" : str(ingred), "amount": str(pls) })
		counter+= 1
	print ingr_dict
	#database
	conn = boto.dynamodb.connect_to_region(
		'us-east-1',
		aws_access_key_id = '',
		aws_secret_access_key = ''
		)
	my_table = conn.get_table('Recipes')
	attrs = {
		'ingredients' : json.dumps(ingr_dict),
		'steps' : json.dumps(step_dict),
		'author' : author,
		'recipe_photo' : photo_link,
		'rating' : star_rating
	}

	item = my_table.new_item(
		hash_key= recipe_name,
		attrs=attrs
	)
	item.put()
	time.sleep(0.25)



#sidechef url

page = 'https://www.sidechef.com/search/query/?q=Beginner&start=360&rows=100'
#open page with firefox
headers = { 'User-Agent' : 'Mozilla/5.0' }
req = urllib2.Request(page, None, headers)
page_html = urllib2.urlopen(req).read()
#parse page to html and store in page_soup
page_soup = soup(page_html, "html.parser")
link_count = 0
for item in page_soup.find_all('a'):
	if link_count > 5:
		individualRecipeScrape(item.get('href')) 
	link_count+=1
