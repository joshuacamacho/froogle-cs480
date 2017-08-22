import wikipedia
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

ingred = []

for i in ingred: 
	recipeString = wikipedia.summary(str(i) , sentences=1)
	conn = boto.dynamodb.connect_to_region(
		'us-east-1',
		aws_access_key_id = '',
		aws_secret_access_key = ''
		)
	my_table = conn.get_table('Ingredients')
	attrs = {
		'description' : recipeString
	}
	item = my_table.new_item(
		hash_key= str(i),
		attrs=attrs
	)
	item.put()
	time.sleep(0.2)

	print "name" + str(i)
	print "description" + recipeString







