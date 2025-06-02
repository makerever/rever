def get_python_date_format(format_string):
    mapping = {
        "YYYY-MM-DD": "%Y-%m-%d",
        "DD-MM-YYYY": "%d-%m-%Y",
        "MM-DD-YYYY": "%m-%d-%Y",
    }
    return mapping.get(format_string, "%Y-%m-%d")
