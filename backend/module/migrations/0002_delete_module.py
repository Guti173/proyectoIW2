from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("module", "0001_initial"),
        ("user", "0003_remove_user_group_delete_group"),
    ]

    operations = [
        migrations.DeleteModel(
            name="Module",
        ),
    ]
